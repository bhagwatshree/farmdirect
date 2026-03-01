output "cluster_endpoint" {
  value = aws_docdb_cluster.main.endpoint
}

output "cluster_port" {
  value = aws_docdb_cluster.main.port
}

output "cluster_resource_id" {
  value = aws_docdb_cluster.main.cluster_resource_id
}
